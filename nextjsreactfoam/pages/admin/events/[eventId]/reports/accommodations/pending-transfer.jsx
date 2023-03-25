import { useState, useEffect } from "react";
import * as React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventAccommodationList from "@/components/forPage/EventAccommodationList";
import PageHeader from "@/components/common/PageHeader";
import FilterLayout from "@/components/layouts/FilterLayout";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import AccommodationsReportHeader from "@/components/common/AccommodationsReportHeader";
import DelegatesTable from "@/components/common/AccommodationsReports/DelegatesTable";

const AccommodationsPendingTransfer = ({
  event,
  filters,
  context,
  pendingTransfer,
}) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };
  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <AccommodationsReportHeader />
      <FilterLayout
        filters={filters}
        templates={[]}
        type={FilterLayout.Types.ALL_DELEGATES}
        itemType={FilterLayout.ItemTypes.EVENT}
        item={event?.id}
      >
        {() => (
          <Panel
            title="Pending Transfer"
            color="inverse"
            maximizable
            collapsable
          >
            <DelegatesTable items={pendingTransfer} />
          </Panel>
        )}
      </FilterLayout>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const pendingTransferFiltersResponse = await api({
        url: `/events/${context.params.eventId}/reports/filters/pending-transfer`,
        headers,
      });
      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          filters: pendingTransferFiltersResponse.data,
        },
      };
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
}
AccommodationsPendingTransfer.Layout = ViewEventLayout;

export default AccommodationsPendingTransfer;
