-- More ways to settle dues: e-wallet (Maya, etc.) and cash at the office.
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'EWALLET';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASH';
ALTER TYPE "PaymentChannelType" ADD VALUE IF NOT EXISTS 'EWALLET';
ALTER TYPE "PaymentChannelType" ADD VALUE IF NOT EXISTS 'CASH';
