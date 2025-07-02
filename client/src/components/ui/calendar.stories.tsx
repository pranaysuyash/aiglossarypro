import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar, type CalendarProps } from './calendar';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const meta: Meta<CalendarProps> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'multiple', 'range'],
    },
    showOutsideDays: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<CalendarProps>;

export const Default: Story = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        <div className="text-sm text-gray-600">
          Selected: {date ? format(date, 'PPP') : 'None'}
        </div>
      </div>
    );
  },
};

export const WithSelectedDate: Story = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date('2024-06-15'));
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
};

export const MultipleSelection: Story = {
  args: {},
  render: () => {
    const [dates, setDates] = useState<Date[]>([
      new Date('2024-06-15'),
      new Date('2024-06-20'),
      new Date('2024-06-25'),
    ]);
    const handleMultipleSelect = (selectedDates: Date[] | undefined) => {
      if (selectedDates) {
        setDates(selectedDates);
      }
    };
    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={handleMultipleSelect}
        className="rounded-md border"
      />
    );
  },
};

export const RangeMode: Story = {
  args: {
    mode: 'range',
    showOutsideDays: true,
  },
  render: (args: CalendarProps) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(2023, 0, 20),
      to: new Date(2023, 0, 25),
    });

    return (
      <div className="space-y-4">
        <Calendar
          {...args}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
        />
        <div className="text-sm text-gray-600">
          Selected range: {dateRange?.from ? format(dateRange.from, 'PPP') : 'None'} 
          {dateRange?.to ? ` to ${format(dateRange.to, 'PPP')}` : ''}
        </div>
      </div>
    );
  },
};

export const WithDisabledDates: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const disabledDays = [
      new Date('2024-06-10'),
      new Date('2024-06-15'),
      new Date('2024-06-20'),
    ];
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disabledDays}
        className="rounded-md border"
      />
    );
  },
};

export const WeekendDisabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const disableWeekends = (date: Date) => {
      return date.getDay() === 0 || date.getDay() === 6;
    };
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disableWeekends}
        className="rounded-md border"
      />
    );
  },
};

export const PastDatesDisabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const disablePastDates = (date: Date) => {
      return date < new Date();
    };
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disablePastDates}
        className="rounded-md border"
      />
    );
  },
};

export const FutureDatesDisabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const disableFutureDates = (date: Date) => {
      return date > new Date();
    };
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disableFutureDates}
        className="rounded-md border"
      />
    );
  },
};

export const CustomStyling: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
        classNames={{
          day_selected: "bg-blue-600 text-white hover:bg-blue-700",
          day_today: "bg-yellow-200 text-yellow-800 font-bold",
        }}
      />
    );
  },
};

export const WithoutOutsideDays: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        showOutsideDays={false}
        className="rounded-md border"
      />
    );
  },
};

export const MinMaxDates: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        fromDate={today}
        toDate={nextMonth}
        className="rounded-md border"
      />
    );
  },
};

export const BookingCalendar: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const [bookedDates] = useState([
      new Date('2024-06-15'),
      new Date('2024-06-16'),
      new Date('2024-06-22'),
      new Date('2024-06-23'),
    ]);
    
    const isBooked = (date: Date) => {
      return bookedDates.some(bookedDate => 
        bookedDate.toDateString() === date.toDateString()
      );
    };
    
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={isBooked}
          className="rounded-md border"
          classNames={{
            day_disabled: "bg-red-100 text-red-400 line-through",
          }}
        />
      </div>
    );
  },
};

export const EventCalendar: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const [events] = useState([
      { date: new Date('2024-06-15'), title: 'AI Conference' },
      { date: new Date('2024-06-18'), title: 'Workshop' },
      { date: new Date('2024-06-25'), title: 'Team Meeting' },
    ]);
    
    const hasEvent = (date: Date) => {
      return events.some(event => 
        event.date.toDateString() === date.toDateString()
      );
    };
    
    return (
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          classNames={{
            day: hasEvent(date) ? "bg-green-100 text-green-800 font-semibold" : "",
          }}
          modifiers={{
            hasEvent: events.map(event => event.date),
          }}
          modifiersClassNames={{
            hasEvent: "bg-green-100 text-green-800 font-semibold relative after:content-['•'] after:absolute after:top-1 after:right-1 after:text-green-600",
          }}
        />
        {date && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Selected: {date.toDateString()}</h4>
            {events
              .filter(event => event.date.toDateString() === date.toDateString())
              .map((event, index) => (
                <div key={index} className="text-sm text-green-600">
                  📅 {event.title}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  },
};
