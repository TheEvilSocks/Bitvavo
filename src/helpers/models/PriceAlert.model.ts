import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: false
})
export class PriceAlert extends Model {
    @PrimaryKey
    @Column(DataType.BIGINT)
    user: string;

    @PrimaryKey
    @Column
    symbol: string;

    @PrimaryKey
    @Column(DataType.ENUM('above', 'below'))
    type: string;

    @Column
    threshold: number;
}