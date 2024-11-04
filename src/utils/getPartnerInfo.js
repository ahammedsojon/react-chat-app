const getPartnerInfo = (participants, email) => {
  return participants.find((user) => user.email !== email);
};

export default getPartnerInfo;
