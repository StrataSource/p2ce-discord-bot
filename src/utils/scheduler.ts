import {SchedulePlan, Task, ScheduledTask} from "../types/scheduler";
import * as persist from '../utils/persist';


/**
 * Resumes a task previously saved to persistence.
 * @param id id of the task to get the data from.
 * @param task
 */
export function resume( guild: string, id: string, task: Task ): ScheduledTask {

}

/**
 * Schedules a task for execution.
 * @param plan
 * @param task
 */
export function schedule( guild: string, plan: SchedulePlan, task: Task ): ScheduledTask {
	persist.data(guild).scheduler[]
}

/**
 * Cancels and removes from persistence a scheduled task.
 * @param task
 */
export function cancelTask( task: ScheduledTask ): number {
	
}

export function run() {
	setInterval(
		() => {

		},
		5
	);
}


/**
 * Stops the scheduler and saves all state.
 */
export function shutdown() {

}

