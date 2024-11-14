export interface GenerateMd5HashParams {
  clickTransId: bigint;
  serviceId: number;
  secretKey: string;
  merchantTransId: string;
  merchantPrepareId?: number;
  amount: number;
  action: number;
  signTime: string;
}
