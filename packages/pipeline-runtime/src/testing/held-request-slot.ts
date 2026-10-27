import {
	createRequestSlot,
	type RequestSlot,
	RequestSlotRejectedError,
	RequestSlotTimeoutError,
} from '../request-slot';

/**
 * A slot whose only lane is held forever, so every request has to wait or be refused. With
 * `maxQueue: 0` the next request is refused at once (`queue_full`); without it the request waits
 * until its signal or deadline fires.
 */
export function createHeldRequestSlot(maxQueue?: number): RequestSlot {
	const slot = createRequestSlot({
		minSpacingMs: 0,
		...(maxQueue === undefined ? {} : { maxQueue }),
	});
	slot.run(() => new Promise<never>(() => {})).catch(() => undefined);
	return slot;
}

/**
 * A slot whose requests wait until the caller's signal aborts, as one stuck in a deep queue does
 * (no deadline timer of its own, so the engine abort is what ends the wait).
 */
export const stuckRequestSlot: RequestSlot = {
	run: (_request, options) =>
		new Promise((_resolve, reject) => {
			options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
				once: true,
			});
		}),
};

/**
 * A slot that admits the first `admit` requests and refuses every later one, counting every `run`
 * it is asked for (`runs`), admitted or not. `refusal` picks the error: `queue_full` is a
 * `RequestSlotRejectedError`; `deadline` is a `RequestSlotTimeoutError` (the deadline passed while
 * the request waited).
 */
export function createRefusingAfterSlot(
	admit: number,
	refusal: 'queue_full' | 'deadline' = 'queue_full'
): RequestSlot & { readonly runs: number } {
	const inner = createRequestSlot({ minSpacingMs: 0 });
	let runs = 0;
	return {
		get runs() {
			return runs;
		},
		run: (request, options) => {
			runs += 1;
			return runs > admit
				? Promise.reject(
						refusal === 'queue_full'
							? new RequestSlotRejectedError('queue_full')
							: new RequestSlotTimeoutError(false)
					)
				: inner.run(request, options);
		},
	};
}
