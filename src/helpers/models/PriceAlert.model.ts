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
    @Column(DataType.ENUM('above', 'below', 'at'))
    type: string;

    @PrimaryKey
    @Column(DataType.DECIMAL(16, 8))
    threshold: number;
}