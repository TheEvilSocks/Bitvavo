import { Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({
    timestamps: false
})
export class TopCrypto extends Model {
    @PrimaryKey
    @Column
    symbol: string;

    @Column
    name: string;

    @Column({ defaultValue: 0 })
    uses: number;
}