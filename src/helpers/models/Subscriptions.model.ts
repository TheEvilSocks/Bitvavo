import { Column, DataType, Index, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: false
})
export class Subscriptions extends Model {
    @PrimaryKey
    @Column(DataType.BIGINT)
    channel: string;

    @Column
    symbol: string;

    @Column
    chart: string;

    @Column
    interval: number;


    @Index({ order: 'DESC' })
    @Column
    lastPosted: Date;
}