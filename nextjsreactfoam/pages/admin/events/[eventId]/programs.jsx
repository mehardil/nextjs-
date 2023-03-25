import React from "react";
import format from "date-fns/format";
import EventProgram from "@/components/forPage/EventProgram";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ADMIN } from "@/constants/roles";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { useEventDispatch } from "@/contexts/EventContext";
import queryString from "query-string";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";

const Programs = ({ event, ...props }) => {
  const eventDispatch = useEventDispatch();

  React.useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return <EventProgram {...{ ...props, event }} />;
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const sessionQueryString = queryString.stringify({
    ...parsedQueryString,
    date: parsedQueryString.date || format(Date.now(), "dd-MM-yyyy"),
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      const sessionBlocksResponse = await api({
        url: `/session-blocks`,
        headers,
      });

      const eventSessionRoomResponse = await api({
        url: `/events/${context.params.eventId}/session-rooms`,
        headers,
      });

      const eventSessionsResponse = await api({
        url: `/events/${context.params.eventId}/sessions?${sessionQueryString}`,
        headers,
      });

      const eventSessionsTableResponse = await api({
        url: `/events/${context.params.eventId}/sessions?orderBy=DateAdded`,
        headers,
      });

      const eventSubmissionCategoriesResponse = await api({
        url: `/events/${context.params.eventId}/submission-categories`,
        headers,
      });

      const presentationTypesResponse = await api({
        url: `/events/${context.params.eventId}/presentation-types`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          presentationTypes: presentationTypesResponse.data.data,
          sessionBlocks: sessionBlocksResponse.data.data,
          sessionRooms: eventSessionRoomResponse.data.data,
          sessions: eventSessionsResponse.data.data,
          sessionsTable: eventSessionsTableResponse.data.data,
          submissionCategories: eventSubmissionCategoriesResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

Programs.authorized = true;
Programs.allowedRoles = [ADMIN];
Programs.Layout = ViewEventLayout;
Programs.defaultProps = {
  events: [],
};

export default Programs;
