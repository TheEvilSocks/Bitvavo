export function shortToLong(time: string[] | string): { name: string, value: string }[] {
	if (typeof time === 'string') time = [time];

	return time.map(a => {
		let name = a;

		if (a.endsWith("y")) {
			let num = parseInt(a.slice(0, -1));
			name = `${num} year${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("mth")) {
			let num = parseInt(a.slice(0, -3));
			name = `${num} month${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("d")) {
			let num = parseInt(a.slice(0, -1));
			name = `${num} day${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("h")) {
			let num = parseInt(a.slice(0, -1));
			name = `${num} hour${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("m")) {
			let num = parseInt(a.slice(0, -1));
			name = `${num} minute${num > 1 ? "s" : ""}`;
		}

		return { name, value: a };
	});
}

export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const unitValues: { [key: string]: number } = {
	millisecond: 0.001,
	second: 1,
	minute: 60,
	hour: 3600,
	day: 86400,
	week: 604800,
	month: 2592000,
	year: 31536000
};

const UNIT_MAP: { [key: string]: string[] } = {
	millisecond: ['ms', 'milli', 'millisecond', 'milliseconds'],
	second: ['s', 'sec', 'secs', 'second', 'seconds'],
	minute: ['m', 'min', 'mins', 'minute', 'minutes'],
	hour: ['h', 'hr', 'hrs', 'hour', 'hours'],
	day: ['d', 'day', 'days'],
	week: ['w', 'week', 'weeks'],
	month: ['mon', 'mth', 'mths', 'month', 'months'],
	year: ['y', 'yr', 'yrs', 'year', 'years']
};

/**
 * Parse a timestring
 */

export function parseTimestring(string: string, date = (new Date()), allowed_units: TimeUnit[] = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year']) {
	let totalSeconds = 0;
	const groups = string
		.toLowerCase()
		.replace(/[^.\w+-]+/g, '')
		.match(/[-+]?[0-9.]+[a-z]+/g);

	if (groups === null)
		throw new Error(`The string [${string}] could not be parsed by the timeparser`);

	groups.forEach(group => {
		let value: number | undefined, unit: string | undefined;

		let _temp = group.match(/[0-9.]+/g);
		if (_temp)
			value = parseInt(_temp[0]);

		_temp = group.match(/[a-z]+/g);
		if (_temp)
			unit = _temp[0];

		if (value !== undefined && unit !== undefined && allowed_units.includes(getUnitKey(unit)))
			totalSeconds += value * unitValues[getUnitKey(unit)];
	});
	return totalSeconds;
}

/**
 * Get the key for a unit
 */

function getUnitKey(unit: string): TimeUnit {
	for (const key of Object.keys(UNIT_MAP))
		if (UNIT_MAP[key].includes(unit)) {
			return key as TimeUnit;
		}

	throw new Error(`The unit [${unit}] is not supported by timestring`);
}
