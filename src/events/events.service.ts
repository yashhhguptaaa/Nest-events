import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class EventsService {

    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>
    ){}

    private getEventsBaseQuery() {
        return this.eventsRepository
        .createQueryBuilder('e')
        .orderBy('e.id','DESC');
    }

    public  getEventsWithAttendeeCountQuery() {
        return this.getEventsBaseQuery()
            .loadRelationCountAndMap(
                'e.attendeeCount','e.attendees'
            );
    }

    public async getEvent(id: number): Promise<Event | undefined >{
        const query =  this.getEventsWithAttendeeCountQuery()
            .andWhere('e.id = :id',{id});

        this.logger.debug(query.getSql());

        return await query.getOne();

    }
}