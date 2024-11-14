export class ClickRequestDto {
  click_trans_id: bigint;
  service_id: number;
  click_paydoc_id: bigint;
  merchant_user_id?: string;
  merchant_trans_id: string;
  user_id?: number;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
  merchant_prepare_id: number;
}
