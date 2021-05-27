const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const UserRepo = require('../../repos/user');
const User = require('../../mongodb/models/user');
const SessionRepo = require('../../repos/session');

const validatePassword = (value, confirm) => {
  if (!value || !confirm) throw new Error('You must provide and confirm your password.');
  if (value.length < 6) throw new Error('Passwords must be at least six characters long.');
  if (value !== confirm) throw new Error('The password does not match the confirmation password.');
};

module.exports = {
  /**
   *
   */
  UserConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    currentUser: (root, args, { auth }) => (auth.isValid() ? auth.user : null),

    /**
     *
     */
    checkSession: async (root, { input }) => {
      const { token } = input;
      const { user, session } = await UserRepo.retrieveSession(token);
      return { user, session };
    },

    /**
     *
     */
    user: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await User.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No user record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allUsers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return new Pagination(User, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchUsers: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { deleted: false }, options);
      return instance.paginate(User, pagination);
    },
  },
  Mutation: {
    /**
     *
     */
    createUser: (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { payload } = input;
      const {
        email,
        givenName,
        familyName,
        password,
        confirmPassword,
        role,
      } = payload;
      validatePassword(password, confirmPassword);
      return UserRepo.create({
        email,
        givenName,
        familyName,
        password,
        role,
      });
    },

    updateUser: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      // Note, this resolver will not update passwords. Use `changeUserPassword` instead.
      const { id, payload } = input;
      const {
        email,
        givenName,
        familyName,
        role,
      } = payload;
      const record = await User.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No user record found for ID ${id}.`);
      record.set({
        email,
        givenName,
        familyName,
        role,
      });
      return record.save();
    },

    deleteUser: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      if (auth.user.id === id) throw new Error('You are currently logged-in and cannot delete yourself.');

      const record = await User.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No user record found for ID ${id}.`);
      record.deleted = true;
      await record.save();
      return 'ok';
    },

    /**
     *
     */
    loginUser: (root, { input }) => {
      const { email, password } = input;
      return UserRepo.login(email, password);
    },

    /**
     *
     */
    deleteSession: async (root, args, { auth }) => {
      if (auth.isValid()) {
        await SessionRepo.delete(auth.session);
      }
      return 'ok';
    },

    changeUserPassword: async (root, { input }, { auth }) => {
      auth.check();
      const { user } = auth;
      const { id, value, confirm } = input;
      if (user.id.valueOf() === id || auth.isAdmin()) {
        validatePassword(value, confirm);
        const record = await User.findOne({ _id: id || null, deleted: false });
        if (!record) throw new Error(`No user record found for ID ${id}.`);
        record.password = value;
        return record.save();
      }
      throw new Error('Only administrators can change passwords for other users.');
    },

    updateCurrentUserProfile: async (root, { input }, { auth }) => {
      auth.check();
      const { givenName, familyName } = input;
      const { user } = auth;
      user.set({ givenName, familyName });
      return user.save();
    },
  },
};
