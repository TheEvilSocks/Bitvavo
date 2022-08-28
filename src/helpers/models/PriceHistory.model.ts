import { Column, DataType, Index, Model, PrimaryKey, Table } from "sequelize-typescript";

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

    @Column(DataType.FLOAT)
    price: number;
}