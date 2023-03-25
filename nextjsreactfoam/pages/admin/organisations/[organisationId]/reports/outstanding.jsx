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
import OrganisationReportOutstandingMemberTable from "@/components/common/OrganisationReportOutstandingMemberTable";
import OrganisationReportOutstandingAddonTable from "@/components/common/OrganisationReportOutstandingAddonTable";
import OrganisationReportHeader from "@/components/common/OrganisationReportHeader";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";

const Outstanding = ({ organisation, ...props }) => {
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
          Members Report
        </Button>
        <Button isActive={!isGrid} onClick={() => setIsGrid(false)}>
          Addons Report
        </Button>
      </Button.Group>
    </>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Outstanding" />
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
                  title={<> Members Report </>}
                >
                  <div className="row justify-content-between my-4">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex justify-content-between ">
                        <Input.Select className="w-100" />
                        <Button color="primary" className="ml-2">
                          Go
                        </Button>
                      </div>
                    </div>

                    <div className=" col-md-6">
                      <div className="d-flex justify-content-end">
                        <Button className="mr-2">Preview</Button>
                        <Button color="primary">
                          <Icon icon="file-o" className="mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                  <OrganisationReportOutstandingMemberTable />
                </Panel>
              )}
              {!isGrid && (
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title={<> Addons Report </>}
                >
                  <OrganisationReportOutstandingAddonTable />
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

Outstanding.authorized = true;
Outstanding.allowedRoles = [ADMIN];
Outstanding.Layout = ViewOrganisationLayout;
Outstanding.defaultProps = {
  Outstandings: [],
};

export default Outstanding;
