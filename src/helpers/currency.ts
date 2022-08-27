export const currencySigns = {
	"BTC": "₿",
	"ETH": "Ξ",
	"LTC": "Ł",
	"EUR": "€",
	"USD": "$",
	"GBP": "£",
};

export function getCurrencySign(name: string) {
	//@ts-ignore
	return Object.prototype.hasOwnProperty.call(currencySigns, name) ? currencySigns[name] : "¤";
}