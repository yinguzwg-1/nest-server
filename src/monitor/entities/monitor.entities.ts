import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Monitor {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    method: string;
    @Column()
    url: string;
    @Column()
    body: string;
    @Column()
    response: string; 
    @Column()
    error: string;
    @Column()
    status_code: number;
    @Column()
    duration: number;
    @Column()
    timestamp: Date;
    @Column()
    query: string;
 

}