import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DelegatesReportHeader from "@/components/common/DelegatesReportHeader";
import DelegatesTable from "@/components/common/DelegatesTable";
import FilterLayout from "@/components/layouts/FilterLayout";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const DelegatesReport = ({
  event,
  templates,
  filters,
  delegates,
  meta,
  context,
}) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

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
      <DelegatesReportHeader />
      <FilterLayout
        filters={filters}
        templates={templates}
        type={FilterLayout.Types.ALL_DELEGATES}
        itemType={FilterLayout.ItemTypes.EVENT}
        item={event?.id}
      >
        {() => (
          <Panel
            title="Event Delegates"
            color="inverse"
            maximizable
            collapsable
          >
            <DelegatesTable
              {...{ delegates }}
              initialPage={meta.current_page}
              numOfPages={meta.last_page}
              initialKeyword={context.query.keyword}
            />
          </Panel>
        )}
      </FilterLayout>
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
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      const delegateFiltersResponse = await api({
        url: `/events/${context.params.eventId}/registrations/filters/special-requirements`,
        headers,
      });

      const delegatesResponse = await api({
        url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
        headers,
      });

      const templatesResponse = await api({
        url: `/filter-templates`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          templates: templatesResponse.data.data,
          filters: delegateFiltersResponse.data,
          delegates: delegatesResponse.data.data,
          meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

DelegatesReport.Layout = ViewEventLayout;

export default DelegatesReport;
