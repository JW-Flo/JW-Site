import { z } from 'zod';

export const onboardingSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().optional(),
  role: z.string().min(1)
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1)
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type OAuthCallbackData = z.infer<typeof oauthCallbackSchema>;
