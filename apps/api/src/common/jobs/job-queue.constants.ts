export const JOB_QUEUE = 'vitacare-jobs';

export const JOB_NAMES = {
  notificationDelivery: 'notification-delivery',
  notificationReconcile: 'notification-reconcile',
  capaDaily: 'capa-daily',
  hahAlertEscalation: 'hah-alert-escalation',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
export type DeliveryJob = { deliveryId: string };
