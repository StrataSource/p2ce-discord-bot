export interface RepeatedSchedulePlan {

	/**
	 * ms before this task is initially executed
	 */
	initialDelay: number,

	/**
	 * ms between task executions
	 */
	distance: number
}

export interface SingleSchedulePlan {
	/**
	 * ms before task execution
	 */
	delay: number
}

export type SchedulePlan = RepeatedSchedulePlan | SingleSchedulePlan;

export type Task = ( task: ScheduledTask, data: unknown ) => void

/**
 * Represents a task that has been submitted to the scheduler.
 */
export interface ScheduledTask {
	/**
	 * Unique id assigned to this scheduled task.
	 */
	readonly id: string,

	/**
	 * The task that will be executed.
	 */
	readonly task: Task,

	/**
	 * The unix timestamp at which this task will run.
	 */
	readonly date: number,

	/**
	 * The guild this task was scheduled on.
	readonly guild: string,

	/**
	 * Cancels and removes from persistence this task.
	 */
	cancel(): void,

	/**
	 * Whether this scheduled task was cancelled.
	 */
	cancelled(): boolean,

	/**
	 * Returns how many ms until this task is executed.
	 */
	remainingTime(): number,
}
