"use client";

import * as React from "react";
import { addDays, format, isSameDay, startOfDay, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  className?: string;
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  className,
}: DatePickerProps) {
  const today = startOfToday();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectPredefinedDate = (date: Date | undefined) => {
    onDateChange?.(date);
    setIsOpen(false);
  };
  
  // Pre-defined date options for quick selection
  const quickSelectOptions = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next Week", date: addDays(today, 7) },
    { label: "In 2 Weeks", date: addDays(today, 14) },
    { label: "Next Month", date: addDays(today, 30) },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full lg:w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              date && "bg-primary/5 border-primary/20"
            )}
          >
            <CalendarIcon className={cn("mr-2 h-4 w-4", date && "text-primary")} />
            {date ? format(date, "EEE, MMM d, yyyy") : <span>Select date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b bg-muted/20">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Quick Select</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickSelectOptions.map((option) => (
                  <Button 
                    key={option.label}
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "h-8 justify-start",
                      date && isSameDay(date, option.date) && 
                      "bg-primary/10 border-primary/20 font-medium text-primary"
                    )}
                    onClick={() => handleSelectPredefinedDate(option.date)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>            <Calendar
            selected={date}
            onSelect={(day) => {
              onDateChange?.(day);
              setIsOpen(false);
            }}
            className="rounded-md border-0"
            classNames={{
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-muted rounded-full",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-full"
              ),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
              day_today: "bg-accent text-accent-foreground rounded-full",
              day_outside:
                "day-outside text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
          
          <div className="p-3 border-t bg-muted/20 flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                onDateChange?.(undefined);
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
