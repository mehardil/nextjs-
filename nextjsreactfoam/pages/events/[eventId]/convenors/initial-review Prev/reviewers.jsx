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
import ConvenorReviewersTable from "@/components/common/ConvenorReviewersTable";
import { useDelegateDashboardDispatch } from "@/contexts/DelegateDashboardContext";

const ConvenorReviewers = ({
  event,
  reviewers,
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
        title="Reviews"
        description={<DelegateConvenorLitReviewAbstractsHeader />}
      />
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
                  title={<> Reviewers </>}
                >
                  <div className="row justify-content-between my-4">
                    <div className=" row col-md-12">
                      <div className="col-md-4">
                        <Input.Select
                          placeholder="Select"
                          onChange={(newVal) => {
                            onChange(newVal);
                          }}
                        />
                      </div>
                      <div className="col-md-2">
                        <Button color="primary" className="ml-n2">
                          Go
                        </Button>
                      </div>

                      <div className="d-flex justify-content-end col-md-6">
                        <Button className="mr-2">Preview</Button>
                        <Button color="primary">
                          <Icon icon="file-o" className="mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                  <ConvenorReviewersTable items={reviewers} />
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

ConvenorReviewers.authorized = true;
ConvenorReviewers.Layout = DelegateDashboardLayout;

export default ConvenorReviewers;
