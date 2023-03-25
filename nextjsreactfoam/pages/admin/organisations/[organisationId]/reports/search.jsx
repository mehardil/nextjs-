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
import OrganisationReportSearchMemberTable from "@/components/common/OrganisationReportSearchMemberTable";
import OrganisationReportSearchAddonTable from "@/components/common/OrganisationReportSearchAddonTable";
import OrganisationReportHeader from "@/components/common/OrganisationReportHeader";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import OrganisationReportSearchHeader from "@/components/common/OrganisationReportSearchHeader";

const Search = ({
  organisation,
  membership_addons,
  templates,
  filters,
  ...props
}) => {
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
      <PageHeader title="Search" />
      <OrganisationReportHeader />
      <hr className="m-t-0 bg-black-transparent-1" />
      <OrganisationReportSearchHeader />

      {/* {viewSwitcher} */}

      <FilterLayout
        filters={filters}
        templates={templates}
        // type={FilterLayout.Types.ALL_DELEGATES}
        itemType={FilterLayout.ItemTypes.ORGANISATION}
        item={organisation?.id}>
        {() => {
          return (
            <>
              {
                <Panel
                  maximizable
                  className="mt-4"
                  color="inverse"
                  title={<> Addons Report </>}
                >
                  <OrganisationReportSearchAddonTable
                    items={membership_addons}
                  />
                </Panel>
              }
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

      const membersAddonsResponse = await api({
        url: `/organisations/${context.query.organisationId}/membership-addons`,
        headers,
      });

      const membersAddonFiltersResponse = await api({
        url: `/organisations/${context.query.organisationId}/membership-addons/filters/search`,
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
          organisation: organisationResponse.data.data,
          membership_addons: membersAddonsResponse.data.data,
          filters: membersAddonFiltersResponse.data,
          templates: templatesResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

Search.authorized = true;
Search.allowedRoles = [ADMIN];
Search.Layout = ViewOrganisationLayout;
Search.defaultProps = {
  Searchs: [],
};

export default Search;
