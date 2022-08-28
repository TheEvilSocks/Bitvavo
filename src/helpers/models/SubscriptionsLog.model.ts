import { Column, DataType, Index, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: false
})
export class SubscriptionLog extends Model {
    @Index
    @Column(DataType.BIGINT)
    channel: string;

    @Index
    symbol: string;

    @PrimaryKey
    @Column(DataType.BIGINT)
    message: string;
}