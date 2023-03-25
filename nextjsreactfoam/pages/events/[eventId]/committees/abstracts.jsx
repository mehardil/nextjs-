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
import CommitteeAbstractsTable from "@/components/common/CommitteeAbstractsTable";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";

const CommitteeAbstracts = ({
  event,
  abstracts,
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
      <FilterLayout
        filters={filters}
        templates={templates}
        type={FilterLayout.Types.ALL_DELEGATES}
        itemType={FilterLayout.ItemTypes.EVENT}
        item={event?.id}
      >
        {() => {
          return (
            <>
              {isGrid && (
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title={<> Abstracts </>}
                >
                  <div className="row justify-content-between my-4">
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
                  <CommitteeAbstractsTable items={abstracts} />
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
        url: `/events/${context.params.eventId}/submissions/filters/search`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          filters: submissionFiltersResponse.data,
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

CommitteeAbstracts.authorized = true;
// CommitteeAbstracts.allowedRoles = [];
CommitteeAbstracts.Layout = DelegateDashboardLayout;

export default CommitteeAbstracts;
