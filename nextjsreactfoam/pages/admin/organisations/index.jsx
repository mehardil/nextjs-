import { useState, forwardRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import nextApi from "@/utils/nextApi";
import getTenant from "@/utils/getTenant";

const AllOrganisations = ({ organisations, context, session, meta }) => {
  const router = useRouter();
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOrganisations, setCurrentOrganisations] = useState(
    organisations
  );
  const [isShowDuplicateModal, setShowDuplicateModal] = useState(false);
  const [organisationsToDuplicate, setOrganisationsToDuplicate] = useState();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "short_name", label: "Short Name" },
    { key: "long_name", label: "Long Name" },
    { key: "contact_name", label: "Contact Name" },
    { key: "contact_phone", label: "Contact Phone" },
    { key: "contact_email", label: "Contact Email" },
    { key: "subscription_date", label: "Subscription Date" },
    { key: "tax_jurisdiction", label: "Tax Jurisdiction" },
    { key: "action", label: "Action", _style: { width: "8%" } },
  ];

  const scopedSlots = {
    short_name: ({ id, short_name }) => {
      return (
        <Link
          href={{
            pathname: paths.ADMIN_ORG_DASHBOARD,
            query: { organisationId: id },
          }}
        >
          <a>{short_name}</a>
        </Link>
      );
    },
    long_name: ({ id, long_name }) => {
      return (
        <Link
          href={{
            pathname: paths.ADMIN_ORG_DASHBOARD,
            query: { organisationId: id },
          }}
        >
          <a>{long_name}</a>
        </Link>
      );
    },
    action: (item) => (
      <>
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Duplicate",
              onClick: () => {
                setOrganisationsToDuplicate(item);
                setShowDuplicateModal(true);
              },
            },
          ]}
        >
          <Link
            href={{
              pathname: paths.ADMIN_ORG_DASHBOARD,
              query: { organisationId: item.id },
            }}
            passHref
          >
            <Button tag="a" size="xs" color="white">
              Open
            </Button>
          </Link>
        </Button.Dropdown>
      </>
    ),
  };

  const pageHeaderToolbar = (
    <Link href={paths.ADMIN_ORG_ADD} passHref>
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.addNewEntity", {
          entity: t("common.organisation", { entries: 1 }),
        })}
      </Button>
    </Link>
  );

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="All Organisations" toolbar={pageHeaderToolbar} />
      <Panel title="Organisations" color="inverse" maximizable collapsable>
        <Table
          items={currentOrganisations}
          columns={columns}
          scopedSlots={scopedSlots}
          onPageChange={handlePageChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
    sortBy: "ID",
  });
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    try {
      /**
       * nextApi is a utility to make a request to the
       * nextJS API (not Currinda API). It is an instance with the
       * App URL as its baseURL.
       */
      const response = await api({
        url: `/organisations?${urlQueryString}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      /**
       * MUST: Always pass the session and context
       * data to the component to have an access to essential
       * data such as the "session.accessToken" inside the component.
       */
      return {
        props: {
          session,
          context: await getContextProps(context),
          organisations: response.data.data,
          meta: response.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {},
  };
};

AllOrganisations.authorized = true;
AllOrganisations.allowedRoles = [ADMIN];
AllOrganisations.Layout = DashboardLayout;
AllOrganisations.defaultProps = {
  organisations: [],
};

export default AllOrganisations;
