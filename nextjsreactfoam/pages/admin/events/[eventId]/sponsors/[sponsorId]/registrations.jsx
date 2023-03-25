import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import Table from "@/components/ui/Table";
import ViewEventSponsorLayout from "@/components/layouts/ViewEventSponsorLayout";
import EventSponsorRegistrationTable from "@/components/common/EventSponsorRegistrationTable"
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const Delegates = ({ sponsor, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;

 


  
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_SPONSOR,
      payload: sponsor,
    });
  }, [sponsor]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Registration" />
      <Panel title="Registration" color="inverse"> <EventSponsorRegistrationTable/></Panel>
     
     
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
    //   const eventResponse = await api({
    //     url: `/events/${context.params.eventId}?withBasicStats=1`,
    //     headers,
    //   });
      

      return {
        props: {
          session,
          context: await getContextProps(context),
          sponsor: {},
      
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

Delegates.Layout = ViewEventSponsorLayout;

export default Delegates;
