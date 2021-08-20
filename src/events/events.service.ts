import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttendeeAnswerEnum } from "./attendee.entity";
import { ListEvents, WhenEventFilter } from "./input/list.events";

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
            )
            .loadRelationCountAndMap(
                'e.attendeeAccepted',
                'e.attendees',
                'attendee',
                (qb) => qb      //Inline Query Builder
                        .where(
                            'attendee.answer = :answer',
                            { answer : AttendeeAnswerEnum.Accepted}
                        )
            )
            .loadRelationCountAndMap(
                'e.attendeeMaybe',
                'e.attendees',
                'attendee',
                (qb) => qb      //Inline Query Builder
                        .where(
                            'attendee.answer = :answer',
                            { answer : AttendeeAnswerEnum.Maybe}
                        )
            )
            .loadRelationCountAndMap(
                'e.attendeeRejected',
                'e.attendees',
                'attendee',
                (qb) => qb      //Inline Query Builder
                        .where(
                            'attendee.answer = :answer',
                            { answer : AttendeeAnswerEnum.Rejected}
                        )
            )
    }

    public async getEventsWithAttendeeCountFiltered(filter?: ListEvents){
        let query = this.getEventsWithAttendeeCountQuery();

        if(!filter) {
            return query.getMany();
        }

        if (filter.when){
            if(filter.when === WhenEventFilter.Today){
                query = query.andWhere(
                    `e.when >= CURDATE() AND e.when <= CURDATE() + INTERNAL 1 DAY`
                );
            }
        }

    }

    public async getEvent(id: number): Promise<Event | undefined >{
        const query =  this.getEventsWithAttendeeCountQuery()
            .andWhere('e.id = :id',{id});

        this.logger.debug(query.getSql());

        return await query.getOne();

    }
}