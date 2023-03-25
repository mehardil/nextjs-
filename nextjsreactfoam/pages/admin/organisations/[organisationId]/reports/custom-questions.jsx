import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { ADMIN } from "@/constants/roles";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import FilterLayout from "@/components/layouts/FilterLayout";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import OrganisationReportCustomQuestionReportTable from "@/components/common/OrganisationReportCustomQuestionReportTable";
import OrganisationReportCustomQuestionSummaryTable from "@/components/common/OrganisationReportCustomQuestionSummaryTable";
import OrganisationReportHeader from "@/components/common/OrganisationReportHeader";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";

const CustomQuestion = ({ organisation, ...props }) => {
  const organisationDispatch = useOrganisationDispatch();
  const [session, loading] = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [isGrid, setIsGrid] = React.useState(true);

  React.useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  const viewSwitcher = (
    <>
      <Button.Group className="mb-3" size="sm" color="primary" bordered rounded>
        <Button
          isActive={isGrid}
          color={isGrid ? "primary" : ""}
          onClick={() => setIsGrid(true)}
        >
          Report
        </Button>
        <Button isActive={!isGrid} onClick={() => setIsGrid(false)}>
          Summary
        </Button>
      </Button.Group>
    </>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Custom Question" />
      <OrganisationReportHeader />

      {viewSwitcher}
      <FilterLayout>
        {() => {
          return (
            <>
              {isGrid && (
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title={<> Report </>}
                >
                  <OrganisationReportCustomQuestionReportTable />
                </Panel>
              )}
              {!isGrid && (
                <Panel
                  maximizable
                  collapsable={true}
                  className="mt-4"
                  color="inverse"
                  title={<> Summary </>}
                >
                  <OrganisationReportCustomQuestionSummaryTable />
                </Panel>
              )}
            </>
          );
        }}
      </FilterLayout>
    </ContentErrorBoundary>
  );
};
export const getServerSideProps = async (context) => {
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
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

CustomQuestion.authorized = true;
CustomQuestion.allowedRoles = [ADMIN];
CustomQuestion.Layout = ViewOrganisationLayout;
CustomQuestion.defaultProps = {
  Outstandings: [],
};

export default CustomQuestion;
