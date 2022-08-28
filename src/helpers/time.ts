export function shortToLong(time: string[]): { name: string, value: string }[] {
	return time.map(a => {
		let name = a;

		if (a.endsWith("m")) {
			let num = parseInt(a.substring(0, a.length - 1));
			name = `${num} minute${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("h")) {
			let num = parseInt(a.substring(0, a.length - 1));
			name = `${num} hour${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("d")) {
			let num = parseInt(a.substring(0, a.length - 1));
			name = `${num} day${num > 1 ? "s" : ""}`;
		}
		else if (a.endsWith("y")) {
			let num = parseInt(a.substring(0, a.length - 1));
			name = `${num} year${num > 1 ? "s" : ""}`;
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
	week: 604800
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
			totalSeconds += getSeconds(value, unit, date);
	});

	return totalSeconds;
}

/**
 * Get the key for a unit
 */

function getUnitKey(unit: string): TimeUnit {
	for (const key of Object.keys(UNIT_MAP))
		if (UNIT_MAP[key].includes(unit))
			return key as TimeUnit;

	throw new Error(`The unit [${unit}] is not supported by timestring`);
}

/**
 *  Get the number of seconds for a value, based on the unit
 */

export function getSeconds(value: number, unit: string, date: Date) {

	switch (getUnitKey(unit)) {
		case 'year':
			return value * daysInYear(date.getUTCFullYear()) * unitValues.d;
		case 'month':
			let ret = 0;
			for (let i = 0; i < value; i++)
				ret += unitValues.d * daysInMonth(date.getUTCMonth() + i, date.getUTCFullYear());
			return ret;

		default:
			return value * unitValues[getUnitKey(unit)];
	}
}


export function daysInMonth(month: number, year: number) {
	return new Date(year, month + 1, 0).getDate();
}

export function daysInYear(year: number) {
	let ret = 0;
	for (let i = 0; i < 12; i++)
		ret += daysInMonth(i, year);
	return ret;
}