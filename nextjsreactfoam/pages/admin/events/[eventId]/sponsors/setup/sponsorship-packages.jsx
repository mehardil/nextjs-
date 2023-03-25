import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventSponsorSetupHeader from "@/components/common/EventSponsorSetupHeader";
import EventSponsorshipPackageTable from "@/components/common/EventSponsorshipPackageTable";
import EventSponsorshipPackageModal from "@/components/modals/EventSponsorshipPackageModal";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";
import PopupAlert from "@/components/ui/PopupAlert";

const SponsorshipPackages = ({ event, sponsorshipPackages, meta, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;
  const [isLoading, setIsLoading] = useState(false);
  const [sponsorshipPackageModal, setSponsorshipPackageModal] = useState(false);
  const [sponsorshipPackage, setSponsorshipPackage] = useState([]);
  const [editSponsorshipPackage, setEditSponsorshipPackage] = useState(false);
  const [deleteSponsorshipPackageId, setDeleteSponsorshipPackageId] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const { addToast } = useToasts();
  const router = useRouter();

  useEffect(() => {
    setEditSponsorshipPackage(sponsorshipPackages);
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onSubmit = async (data) => {
    editSponsorshipPackage?.id ? onSaveChanges(data) : onCreate(data);
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setSponsorshipPackageModal(true);
        setEditSponsorshipPackage();
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.sponsorshipPackage"),
      })}{" "}
    </Button>
  );

  const handleDelete = (id) => {
    setDeleteSponsorshipPackageId(id);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (items) => {
    setSponsorshipPackageModal(true);
    setEditSponsorshipPackage(items);
  };

  const onConfirm = async () => {
    setSaving(true);

    try {
      const session = await getSession(context);
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      await api.delete(
        `events/${event?.id}/sponsor-packages/${deleteSponsorshipPackageId}`,

        { headers }
      );

      addToast("Sponsor package successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to delete sponsor package.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const onSaveChanges = async (data) => {
    setSaving(true);
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        admin: data?.admin || 0,
        _method: "PUT",
      };

      const session = await getSession(context);
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      await api.post(
        `events/${event?.id}/sponsor-packages/${editSponsorshipPackage?.id}`,
        formData,
        { headers }
      );

      addToast("Sponsor package successfully updated.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to update sponsor package.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setIsLoading(true);
    }
  };

  const onCreate = async (data) => {
    setSaving(true);

    try {
      const session = await getSession(context);
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      await api.post(
        `events/${event?.id}/sponsor-packages`,
        { ...data, admin: data?.admin.value || 0 },
        {
          headers,
        }
      );

      addToast("Sponsor package successfully added.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Sponsor package successfully added.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } finally {
      setSaving(false);
      setSponsorshipPackage(false);
      setSponsorshipPackageModal(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Setup" toolbar={pageHeaderToolbar} />
      {sponsorshipPackageModal && (
        <EventSponsorshipPackageModal
          isShow={sponsorshipPackageModal}
          onHide={() => setSponsorshipPackageModal(false)}
          onSubmit={onSubmit}
          isSaving={isSaving}
          defaultValues={editSponsorshipPackage}
        />
      )}
      <EventSponsorSetupHeader />
      <Panel title="Sponsorship Package" color="inverse" maximizable>
        <EventSponsorshipPackageTable
          items={sponsorshipPackages}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
        />
      </Panel>
      {showDeleteConfirm && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isSaving}
        >
          Are you sure you want to delete this sponsorship package?
        </PopupAlert>
      )}
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
      const sponsorshipPackageResponse = await api({
        url: `/events/${context.params.eventId}/sponsor-packages`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          sponsorshipPackages: sponsorshipPackageResponse.data.data,
          //meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

SponsorshipPackages.Layout = ViewEventLayout;

export default SponsorshipPackages;
