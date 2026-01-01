import { Polar } from '@polar-sh/sdk';

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_ACCESS_TOKEN is not set');
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

export const POLAR_CONFIG = {
  organizationId: process.env.POLAR_ORGANIZATION_ID!,
  productIds: {
    monthly: process.env.POLAR_PRODUCT_ID_MONTHLY!,
  },
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET, // Optional for now
};
