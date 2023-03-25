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
import DelegateCommitteeHeader from "@/components/common/DelegateCommitteeHeader";
import FilterLayout from "@/components/layouts/FilterLayout";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";
import CommitteeLedgerTable from "@/components/common/CommitteeLedgerTable";

const CommitteeLedger = ({
  event,
  ledger,
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
      <PageHeader title="Committee" description={<DelegateCommitteeHeader />} />
      <FilterLayout filters={filters} templates={templates}>
        {() => {
          return (
            <>
              {isGrid && (
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title="Ledgers"
                >
                  <div className="row justify-content-between mb-2">
                    <div className=" col-md-12">
                      <div className="d-flex justify-content-end">
                        <Button className="mr-2">Preview</Button>
                        <Button color="primary">
                          <Icon icon="file-o" className="mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CommitteeLedgerTable items={ledger} />
                </Panel>
              )}
            </>
          );
        }}
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
      const delegatesResponse = await api({
        url: `/events/${context.params.eventId}/registrations?${urlQueryString}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
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

CommitteeLedger.authorized = true;
// CommitteeLedger.allowedRoles = [];
CommitteeLedger.Layout = DelegateDashboardLayout;

export default CommitteeLedger;
