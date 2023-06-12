// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { fetchEventsData } from '../actions/calendar';
import { useTypeDispatch } from '../store';
import ScheduleCalendar from './calendar/Scheduler';
import AuthenticatedView from '../components/AuthenticatedView';
import { withTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { ActionButton } from '../components/messages/MailActions';
import Popover from '@mui/material/Popover';


const styles: any = {
  eventBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  importanceLevelDropdown: {
    borderRadius: '4px',
    boxShadow: '0 0 6px 0 rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    listStyleType: 'none',
    padding: 0,
  },
  importanceLevelItem: {
    padding: '10px 20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',

    "&:hover": {
      backgroundColor: '#f6f6f6',
    },
  }
};
export type CalendarView = 'monthView' | 'dayView' | 'weekView'

function Calendar({ t, classes }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('monthView')




  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetCalendarView = (view: CalendarView) => {
    setCalendarView(view)
    handleClose()
    return
  }

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;


  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <div className={classes.eventBar}>
          <Button key={0} variant='contained' color="primary">
            {"New event"}
          </Button>

          <div>
            <ActionButton
              aria-describedby={id}
              key={1}
              onClick={handleClick}
            >
              {t(calendarView)}
            </ActionButton>

            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <ul className={classes.importanceLevelDropdown}>
                <li onClick={() => handleSetCalendarView('dayView')} className={classes.importanceLevelItem}>Day View</li>
                <li onClick={() => handleSetCalendarView('weekView')} className={classes.importanceLevelItem}>Week View</li>
                <li onClick={() => handleSetCalendarView('monthView')} className={classes.importanceLevelItem}>Month View</li>
              </ul>
            </Popover>
          </div>



        </div>
      ]}
    >

      <ScheduleCalendar calendarView={calendarView} app={app} />
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
