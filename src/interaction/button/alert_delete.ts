import { ComponentContext } from "slash-create";
import { getCurrencySign } from "../../helpers/currency";
import { InteractionPlugin } from "../../helpers/InteractionPlugin";
import { PriceAlert } from "../../helpers/models/PriceAlert.model";
import { ErrorResponse, OKResponse } from "../../helpers/response";

class DeleteAlertButton extends InteractionPlugin {

	constructor() {
		super('deletealert');
	}

	async shouldTrigger(custom_id: string, ctx: ComponentContext): Promise<boolean> {
		return custom_id.startsWith('alert_delete');
	}

	//alert_delete_${alert.symbol}-${alert.type}-${alert.threshold}
	async run(ctx: ComponentContext): Promise<any> {
		const [symbol, type, threshold] = ctx.customID.split('_')[2].split('-');
		if (symbol === undefined || type === undefined || threshold === undefined) return;
		ctx.defer(true);

		const alert = await PriceAlert.destroy({
			where: {
				symbol,
				type,
				threshold,
				user: ctx.user.id
			}
		});

		if (alert === 0)
			return ctx.send(ErrorResponse("No alert", "No alert found."), { ephemeral: true });

		return ctx.send(
			OKResponse("Alert deleted", `Alert for **${symbol}** ${type} ${getCurrencySign('EUR')} ${threshold} has been deleted.`)
		);
	}
}

export default new DeleteAlertButton();
//<:ban:452497446518521866>