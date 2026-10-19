# Senvara State Machine

                         ┌──────────────────┐
                         │ AWAITING_REVIEWER│
                         └────────┬─────────┘
              reviewer responds  │  reviewer declines
                                 v
                         ┌──────────────────┐       DECLINED
                         │ READY_FOR_REVIEW │
                         └────────┬─────────┘
              evaluated observation│  deadline
                         ┌─────────┘       v
                         v          EXPIRED_UNRESOLVED
              DECIDED or retryable
                         │
                         └─ retryable → READY_FOR_REVIEW
                                        └─ third retryable → REVIEW_EXHAUSTED

 AWAITING_REVIEWER ── proposer withdraws ──> WITHDRAWN
 AWAITING_REVIEWER ── response deadline ──> EXPIRED_UNANSWERED

Only the named reviewer can respond or decline. Only the proposer can withdraw. Only the two named participants can spend evaluation attempts. Any direct Studionet wallet can close an elapsed deadline. There is no transition from missing evidence or a retryable provider/model failure to a favorable or adverse decision.
