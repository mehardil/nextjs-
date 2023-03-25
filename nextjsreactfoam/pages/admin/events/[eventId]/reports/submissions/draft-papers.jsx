import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import SubmissionsReportHeader from "@/components/common/SubmissionsReportHeader";
import DraftPapersTable from "@/components/common/DraftPapersTable";
import FilterLayout from "@/components/layouts/FilterLayout";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const SubmissionsReportDraftPapers = ({ event, filters, draftPapers }) => {
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
      <SubmissionsReportHeader />
      <FilterLayout
        filters={filters}
        templates={[]}
        type={FilterLayout.Types.ALL_DELEGATES}
        itemType={FilterLayout.ItemTypes.EVENT}
        item={event?.id}
      >
        {() => (
          <Panel
            title={t("common.draftPapers")}
            color="inverse"
            maximizable
            collapsable
          >
            <DraftPapersTable items={draftPapers} />
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

      const submissionFiltersResponse = await api({
        url: `/events/${context.params.eventId}/submissions/filters/draft-papers`,
        headers,
      });
      const submissionsDraftPapersResponse = await api({
        url: `/events/${context.params.eventId}/submissions/draft-papers`,
        headers,
      });
      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          filters: submissionFiltersResponse.data,
          draftPapers: submissionsDraftPapersResponse.data.data,
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

SubmissionsReportDraftPapers.Layout = ViewEventLayout;

export default SubmissionsReportDraftPapers;
