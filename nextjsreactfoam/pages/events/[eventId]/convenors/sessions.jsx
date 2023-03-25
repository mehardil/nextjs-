import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DelegateDashboardLayout from "@/components/layouts/DelegateDashboardLayout";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import DelegateConvenorLitReviewAbstractsHeader from "@/components/common/DelegateConvenorLitReviewAbstractsHeader";
import FilterLayout from "@/components/layouts/FilterLayout";
import ConvenorSessionsTable from "@/components/common/ConvenorSessionsTable";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";

const ConvenorSessions = ({
  event,
  sessions,
  meta,
  context,
  templates,
  filters,
}) => {
  const t = useTranslations();
  const initialNumOfEntries = context.query.perPage;
  const [isGrid, setIsGrid] = useState(true);
  const delegateDashboardDispatch = useDelegateDashboardDispatch();

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    delegateDashboardDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader
        title="Convenor"
        description={<DelegateConvenorLitReviewAbstractsHeader />}
      />
      {isGrid && (
        <Panel
          maximizable
          className="mt-4"
          color="inverse"
          title={<> Sessions </>}
        >
          <ConvenorSessionsTable items={sessions} />
        </Panel>
      )}
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
      const sessionsResponse = await api({
        url: `/events/${context.params.eventId}/sessions`,
        headers,
      });
      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          sessions: sessionsResponse.data.data,
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

ConvenorSessions.authorized = true;
ConvenorSessions.Layout = DelegateDashboardLayout;

export default ConvenorSessions;
