import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assistant: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().trim().min(1).max(6000),
          agentMode: z.boolean().default(false),
        }),
      )
      .mutation(async ({ input }) => {
        const mode = input.agentMode ? "agent planning mode" : "conversation mode";
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are AI Assistant, a concise, trustworthy mobile assistant. You are operating in a prototype with no browser, connected accounts, files, microphone, scheduler, or external tool execution. Never imply that you performed an external action, accessed a document, searched the web, changed an account, or scheduled work. For consequential requests, outline a safe plan and state which user approval or integration would be required. Keep answers under 220 words and use short paragraphs.",
              },
              { role: "system", content: `Current interaction mode: ${mode}.` },
              { role: "user", content: input.message },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const answer = typeof rawContent === "string" ? rawContent.trim() : "";
          return {
            status: "ready" as const,
            answer: answer || "I could not form a response. Please try again.",
            suggestedTask: input.agentMode
              ? {
                  title: "Review assistant plan",
                  summary: "Review the proposed plan before connecting tools or approving external actions.",
                  riskLevel: "low" as const,
                }
              : null,
          };
        } catch (error) {
          console.error("[assistant.chat] model request failed", error);
          return {
            status: "degraded" as const,
            answer:
              "The assistant model is temporarily unavailable. Your request is still visible in this local session, but no external action was attempted.",
            suggestedTask: null,
          };
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
