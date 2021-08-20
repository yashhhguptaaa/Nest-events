import { Body, Controller, Delete, Get, HttpCode, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, MoreThan, Repository } from "typeorm";
import { Attendee } from "./attendee.entity";
import { CreateEventDto } from "./input/create-event.dto";
import { Event } from "./event.entity";
import { EventsService } from "./events.service";
import { UpdateEventDto } from "./input/update-event.dto";
import { ListEvents } from "./input/list.events";

@Controller('/events')
export class EventsController { 
    private readonly logger = new Logger(EventsController.name)

    constructor(
        @InjectRepository(Event)
        private readonly repository: Repository<Event>,
        @InjectRepository(Attendee)
        private readonly attendeeRepository: Repository<Attendee>,
        private readonly eventsService : EventsService
    ){}

    @Get()
    async findAll(@Query() filter: ListEvents) {
        // return this.events;
        this.logger.log(`Hit the findAll route`);
        const events = await this.repository.find();
        this.logger.debug(`Found ${events.length} events`);
        return events;
    }

    @Get('/practice') 
    async practice() {
        return await this.repository.find({
            select: ['id','when'],
            where: 
            [{
                id: MoreThan(3),
                when: MoreThan(new Date('2021-02-12T13:00:00'))

            },{
                description: Like('%meet%')
            }],
            take:2 ,
            order : {
                id: 'DESC'
            }
        });
    }

    @Get('/practice2')
    async practice2() {
        //   return await this.repository.findOne(
        //       1,
        //       { relations: ['attendees']}
        //   );

        const event = await this.repository.findOne(1, {
            relations: ['attendees']
        });
        // const event = new Event();
        // event.id=1;

        const attendee = new Attendee();
        attendee.name = 'Tommy';
        // attendee.event = event;
  
        event.attendees.push(attendee);

        await this.repository.save(event);

        return event;

    }
    

    @Get(':id')
    async findOne(@Param('id' , ParseIntPipe) id : number) {
        console.log(typeof id);
        // const event = this.events.find(event => event.id === parseInt(id));
        // return  event;
        const event =  await this.eventsService.getEvent(id);
        
        if(!event) {
            throw new NotFoundException();
        }

        return event;
        
    }  

    @Post() 
    async create(@Body() input: CreateEventDto) {
        // const event = {
        //     ...input,
        //     when : new Date(input.when),
        //     id : this.events.length +1
        // }
        // this.events.push(event);
        // return event;

        return await this.repository.save({
            ...input,
            when: new Date(input.when)
        });
    }

    @Patch(':id')
    async update(
        @Param('id') id ,
        @Body() input : UpdateEventDto) {
        // const index = this.events.findIndex(
        //     event => event.id === parseInt(id)
        // );

        // this.events[index] = {
        //     ...this.events[index],
        //     ...input,
        //     when: input.when ? new Date(input.when) : this.events[index].when

        // }

        // return this.events[index];

        const event  = await this.repository.findOne(id);

        if(!event) {
            throw new NotFoundException();
        }
        return await this.repository.save({
            ...event,
            ...input,
            when: input.when ? new Date(input.when) : event.when 
        })
        
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id) {
        // this.events = this.events.filter(event => event.id !== parseInt(id));
        const event = await this.repository.findOne(id);
        if(!event) {
            throw new NotFoundException();
        }
        await this.repository.remove(event);
    }  
     
}