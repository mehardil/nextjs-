import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DelegateDashboardLayout from "@/components/layouts/DelegateDashboardLayout";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import DelegateCommitteeHeader from "@/components/common/DelegateCommitteeHeader";
import FilterLayout from "@/components/layouts/FilterLayout";
import CommitteeReconcilationTable from "@/components/common/CommitteeReconcilationTable";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";

const CommitteeReconcilation = ({
  event,
  reconcilation,
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
                  title={<> Reconcilation </>}
                >
                  <h5>Reconcilliation Report | Sponsors & Trade</h5>
                  <h2>BPCO 2020</h2>
                  <p>
                    This report is generated with Cash accounting method at
                    07/10/2020 17:25
                  </p>
                  <div className="row mb-4">
                    <div className="col-md-6" />
                    <div className="offset-md-3 col-md-3">
                      <div className="d-flex justify-content-end">
                        <Button color="default" className="mr-2">
                          Preview
                        </Button>
                        <Button className="btn-primary">
                          <Icon icon="download" className="mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Panel
                    collapsable
                    className="mt-4"
                    color="primary"
                    title="Registrations"
                  >
                    <CommitteeReconcilationTable />
                  </Panel>
                  <Panel
                    collapsable
                    className="mt-4"
                    color="success"
                    title="Cancel Registrations"
                  >
                    <CommitteeReconcilationTable />
                  </Panel>
                  <Panel
                    collapsable
                    className="mt-4"
                    color="info"
                    title="Social Functions"
                  >
                    <CommitteeReconcilationTable />
                  </Panel>
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

CommitteeReconcilation.authorized = true;
// CommitteeReconcilation.allowedRoles = [];
CommitteeReconcilation.Layout = DelegateDashboardLayout;

export default CommitteeReconcilation;
