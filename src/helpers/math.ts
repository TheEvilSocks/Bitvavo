export function round(number: number, decimals: number = 0): number {
	const sign = Math.sign(number);
	let res = Math.abs(number);
	res = parseFloat(Math.round(parseFloat(res + 'e' + decimals)) + 'e-' + decimals);
	return res === -0 ? 0 : res * sign;
}

/**
 * Create a string from a number with a fixed amount of decimals, but if it ends with a lot of zeros, remove them.
 * @param number 
 * @param decimalCount 
 */
export function decimals(number: number, minDecimals: number, maxDecimals: number): string {
	let res = round(number, maxDecimals).toFixed(maxDecimals);
	while (res.endsWith('0') && res.substring(res.indexOf('.') + 1).length > minDecimals)
		res = res.slice(0, -1);
	return res;
}