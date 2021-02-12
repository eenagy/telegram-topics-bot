import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/telegram-types'

export type weekDays = [string, string, string, string, string, string, string];
export type monthNames = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface TelegramCalenderOptions {
  startWeekDay?: number;
  weekDayNames?: weekDays;
  monthNames?: monthNames;
  minDate?: Date;
  maxDate?: Date;
}
const defaultCalendar: TelegramCalenderOptions = {
  startWeekDay: 1,
  weekDayNames: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  monthNames: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  minDate: null,
  maxDate: null,
};

@Injectable()
export class Calendar {
  options: TelegramCalenderOptions;
  constructor() {
    this.options = {...defaultCalendar};
  }

  renderToday(): any {
    const today = new Date();
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);
    maxDate.setDate(today.getDate());
    this.setMinDate(minDate);
    this.setMaxDate(maxDate);
    return this.getCalendarMarkup(today);
  }
  getCalendarMarkup(date: Date): any {
    return Markup.inlineKeyboard(this.getPage(date));
  }

  setMinDate(date: Date): void {
    if (this.options.maxDate && date > this.options.maxDate) {
      throw "Min date can't be greater than max date";
    }
    this.options.minDate = date;
  }

  setMaxDate(date: Date): void {
    if (this.options.minDate && date < this.options.minDate) {
      throw "Max date can't be lower than min date";
    }
    this.options.maxDate = date;
  }

  setWeekDayNames(names: weekDays): void {
    this.options.weekDayNames = names;
  }

  setMonthNames(names: monthNames): void {
    this.options.monthNames = names;
  }

  setStartWeekDay(startDay: number): void {
    this.options.startWeekDay = startDay;
  }

  addHeader(page: any[], date: Date): void {
    const monthName = this.options.monthNames[date.getMonth()];
    const year = date.getFullYear();

    const header = [];

    if (this.isInMinMonth(date)) {
      // this is min month, I push an empty button
      header.push(
        Markup.button.callback(' ', 'calendar-telegram-ignore-minmonth'),
      );
    } else {
      header.push(
        Markup.button.callback(
          '<',
          'calendar-telegram-prev-' + Calendar.toYyyymmdd(date),
        ),
      );
    }

    header.push(
      Markup.button.callback(
        monthName + ' ' + year,
        'calendar-telegram-ignore-monthname',
      ),
    );

    if (this.isInMaxMonth(date)) {
      // this is max month, I push an empty button
      header.push(
        Markup.button.callback(' ', 'calendar-telegram-ignore-maxmonth'),
      );
    } else {
      header.push(
        Markup.button.callback(
          '>',
          'calendar-telegram-next-' + Calendar.toYyyymmdd(date),
        ),
      );
    }

    page.push(header);

    page.push(
      this.options.weekDayNames.map((e, i) =>
        Markup.button.callback(e, 'calendar-telegram-ignore-weekday' + i),
      ),
    );
  }

  addDays(page: any[], date: Date): void {
    const maxMonthDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const maxDay = this.getMaxDay(date);
    const minDay = this.getMinDay(date);

    let currentRow = Calendar.buildFillerRow('firstRow-');
    for (let d = 1; d <= maxMonthDay; d++) {
      date.setDate(d);

      const weekDay = this.normalizeWeekDay(date.getDay());
      //currentRow[weekDay] = Calendar.toYyyymmdd(date);
      if (d < minDay || d > maxDay) {
        currentRow[weekDay] = Markup.button.callback(
          Calendar.strikethroughText(d.toString()),
          'calendar-telegram-ignore-' + Calendar.toYyyymmdd(date),
        );
      } else {
        currentRow[weekDay] = Markup.button.callback(
          d.toString(),
          'calendar-telegram-date-' + Calendar.toYyyymmdd(date),
        );
      }

      if (weekDay == 6 || d == maxMonthDay) {
        // I'm at the end of the row: I create a new filler row
        page.push(currentRow);
        currentRow = Calendar.buildFillerRow('lastRow-');
      }
    }
  }

  getPage(inputDate: Date): Array<any>[] {
    // I use a math clamp to check if the input date is in range
    const dateNumber = Math.min(
      Math.max(inputDate.getTime(), this.options.minDate.getTime()),
      this.options.maxDate.getTime(),
    );
    const date = new Date(dateNumber);

    const page = [];
    this.addHeader(page, date);
    this.addDays(page, date);
    return page;
  }

  normalizeWeekDay(weekDay: number): number {
    let result = weekDay - this.options.startWeekDay;
    if (result < 0) result += 7;
    return result;
  }

  /**
   * Calculates min day depending on input date and minDate in options
   *
   * @param {*Date} date Test date
   *
   * @returns int
   */
  getMinDay(date: Date): number {
    let minDay: number;
    if (this.isInMinMonth(date)) {
      minDay = this.options.minDate.getDate();
    } else {
      minDay = 1;
    }

    return minDay;
  }

  /**
   * Calculates max day depending on input date and maxDate in options
   *
   * @param {*Date} date Test date
   *
   * @returns int
   */
  getMaxDay(date: Date): number {
    let maxDay: number;
    if (this.isInMaxMonth(date)) {
      maxDay = this.options.maxDate.getDate();
    } else {
      maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    return maxDay;
  }

  static toYyyymmdd(date: Date): string {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();

    return [
      date.getFullYear(),
      (mm > 9 ? '' : '0') + mm,
      (dd > 9 ? '' : '0') + dd,
    ].join('-');
  }

  /**
   * Check if inupt date is in same year and month as min date
   */
  isInMinMonth(date: Date): boolean {
    return Calendar.isSameMonth(this.options.minDate, date);
  }

  /**
   * Check if inupt date is in same year and month as max date
   */
  isInMaxMonth(date: Date): boolean {
    return Calendar.isSameMonth(this.options.maxDate, date);
  }

  /**
   * Check if myDate is in same year and month as testDate
   *
   * @param {*Date} myDate input date
   * @param {*Date} testDate test date
   *
   * @returns bool
   */
  static isSameMonth(myDate: Date, testDate: Date): boolean {
    if (!myDate) return false;

    testDate = testDate || new Date();

    return (
      myDate.getFullYear() === testDate.getFullYear() &&
      myDate.getMonth() === testDate.getMonth()
    );
  }

  /**
   * This uses unicode to draw strikethrough on text
   * @param {*String} text text to modify
   */
  static strikethroughText(text: string): string {
    return text.split('').reduce(function (acc, char) {
      return acc + char + '\u0336';
    }, '');
  }

  /**
   * Builds an array of seven ignored callback buttons
   * @param {*String} prefix String to be added before the element index
   */
  static buildFillerRow(prefix: string): InlineKeyboardButton.CallbackButton[] {
    const buttonKey = 'calendar-telegram-ignore-filler-' + prefix;
    return Array.from({ length: 7 }, (_, k) =>
      Markup.button.callback(' ', buttonKey + k),
    );
  }
}

