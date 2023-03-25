import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventSponsorSetupHeader from "@/components/common/EventSponsorSetupHeader";
import EventConfirmSponsorTable from "@/components/common/EventConfirmSponsorTable";
import EventConfirmSponsorModal from "@/components/modals/EventConfirmSponsorModal";
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
import isObject from "lodash/isObject";

const ConfirmSponsor = ({ event, confirmSponsors, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const router = useRouter();

  const initialNumOfEntries = context.query.perPage;
  const [isSaving, setSaving] = useState(false);
  const [confirmSponsorModal, setConfirmSponsorModal] = useState(false);
  const [editConfirmSponsor, setEditConfirmSponsor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmSponsorId, setDeleteConfirmSponsorId] = useState(false);


  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const refreshData = () => {
    router.replace(router.asPath);
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
        setConfirmSponsorModal(true);
        setEditConfirmSponsor();
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addConfrimEntity", {
        entity: t("common.sponsor", { entries: 1 }),
      })}
    </Button>
  );

  const handleDelete = (id) => {
    setDeleteConfirmSponsorId(id);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (items) => {
    setConfirmSponsorModal(true);
    setEditConfirmSponsor(items);
  };

  const onConfirm = async () => {
    setSaving(true);
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      await api.delete(
        `events/${event?.id}/confirmed-sponsor/${deleteConfirmSponsorId}`,
        { headers }
      );

      addToast("Sponsor successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to delete sponsor.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const onSubmit = async (data) => {
    editConfirmSponsor?.id ? onSaveChanges(data) : onCreate(data);
  };

  const onCreate = async ({
    company,
    sponsorship_package,
    sponsorship_raised_by,
    sponsorship_type,
    ...data
  }) => {
    setSaving(true);

    try {
      const formData = {
        sponsorship_package: sponsorship_package?.value,
        company: company?.value,
        sponsorship_raised_by: sponsorship_raised_by?.value,
        sponsorship_type: sponsorship_type?.value,
        ...data,
      };

      const session = await getSession(context);
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      await api.post(`events/${event?.id}/confirmed-sponsor`, formData, {
        headers,
      });

      addToast("Sponsor successfully added.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to add sponsor.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setConfirmSponsorModal(false);
    }
  };

  const onSaveChanges = async ({
    company,
    sponsorship_package,
    sponsorship_raised_by,
    sponsorship_type,
    ...data
  }) => {
    setSaving(true);

    try {
      const formData = {
        sponsorship_package: sponsorship_package?.id
          ? sponsorship_package?.id
          : sponsorship_package?.value,

        company: company?.id ? company?.id : company?.value,

        sponsorship_raised_by: isObject(sponsorship_raised_by)
          ? sponsorship_raised_by?.value
          : sponsorship_raised_by,

        sponsorship_type: isObject(sponsorship_type)
          ? sponsorship_type?.value
          : sponsorship_type,

        ...data,
      };

      const session = await getSession(context);
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      await api.put(
        `events/${event?.id}/confirmed-sponsor/${editConfirmSponsor?.id}`,
        formData,
        { headers }
      );

      addToast("Sponsor successfully updated.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to update sponsor.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Setup" toolbar={pageHeaderToolbar} />
      <EventSponsorSetupHeader />
      {confirmSponsorModal && (
        <EventConfirmSponsorModal
          isShow={confirmSponsorModal}
          onHide={() => setConfirmSponsorModal(false)}
          context={context}
          onSubmit={onSubmit}
          isSaving={isSaving}
          defaultValues={editConfirmSponsor}
        />
      )}
      <Panel title="Confirm Sponsor" color="inverse" maximizable>
        <EventConfirmSponsorTable
          items={confirmSponsors}
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
        >
          Are you sure you want to delete this sponsor?
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
      const confirmSponsorsResponse = await api({
        url: `/events/${context.params.eventId}/confirmed-sponsor`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          confirmSponsors: confirmSponsorsResponse.data.data,
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

ConfirmSponsor.Layout = ViewEventLayout;

export default ConfirmSponsor;
