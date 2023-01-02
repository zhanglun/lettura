export const promisePool = ({
	limit,
	fns,
}: { limit: number; fns: Promise<any>[] }) => {
	let cur = 0;
	let tasks: Promise<any>[] = [];
	const res: Promise<any>[] = [];

	const enQueue = (): Promise<any> => {
		if (cur === fns?.length || fns.length === 0) {
			return Promise.resolve();
		}

		const fn = fns[cur];

		cur += 1;

		const p = Promise.resolve().then(() => fn);

		res.push(p);

		let r = Promise.resolve();

		console.log("tasks.length", tasks.length);

		if (limit <= fns.length) {
			const e: Promise<any> = p.then(() => tasks.splice(tasks.indexOf(e), 1));

			tasks.push(e);

			if (tasks.length >= limit) {
				r = Promise.race(tasks);
			}
		}

		return r.then(() => enQueue());
	};

	const run = () => {
		return enQueue().then(() => {
			return Promise.allSettled(res);
		});
	};

	return {
		run,
	};
};
