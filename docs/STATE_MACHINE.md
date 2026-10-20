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
                         └─ (0.1.0 only) third finalized retryable → REVIEW_EXHAUSTED

 AWAITING_REVIEWER ── proposer withdraws ──> WITHDRAWN
 AWAITING_REVIEWER ── response deadline ──> EXPIRED_UNANSWERED

Only the named reviewer can respond or decline. Only the proposer can withdraw. Only the two named participants can request evaluations. Any direct Studionet wallet can close an elapsed deadline. There is no transition from missing evidence or a retryable provider/model failure to a favorable or adverse decision. The deployed 0.1.0 state machine counts every finalized retryable observation toward exhaustion; deployed 0.2.0 keeps retryable diagnostics in `READY_FOR_REVIEW`, leaves `attempts` at zero, and makes the first conclusive observation terminal `DECIDED`. `REVIEW_EXHAUSTED` is retained only as a defensive compatibility guard and is not produced by the normal v0.2.0 state machine.
