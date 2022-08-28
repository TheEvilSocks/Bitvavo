import { Column, Index, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: false
})
export class PriceHistory extends Model {
    @PrimaryKey
    @Column
    symbol: string;


    @PrimaryKey
    @Index({ order: 'DESC' })
    @Column
    timestamp: Date;

    @Column
    price: number;
}